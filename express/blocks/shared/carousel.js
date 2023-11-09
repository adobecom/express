import {
  createTag,
  loadCSS,
// eslint-disable-next-line import/no-unresolved
} from '../../scripts/utils.js';

function correctCenterAlignment(plat) {
  if (plat.parentElement.offsetWidth <= plat.offsetWidth) return;
  plat.parentElement.style.maxWidth = `${plat.offsetWidth}px`;
}

export function initToggleTriggers(parent) {
  if (!parent) return;

  const isInHiddenSection = () => {
    const parentSection = parent.closest('.section');
    if (!parentSection) return false;

    return parent.dataset.toggle && parent.style.display === 'none';
  };

  const leftControl = parent.querySelector('.carousel-fader-left');
  const rightControl = parent.querySelector('.carousel-fader-right');
  const leftTrigger = parent.querySelector('.carousel-left-trigger');
  const rightTrigger = parent.querySelector('.carousel-right-trigger');
  const platform = parent.querySelector('.carousel-platform');

  // Left intersection observers to toggle left arrow and gradient
  const onFirstSlideIntersect = ([entry]) => {
    if (isInHiddenSection()) return;
    if (entry.isIntersecting) {
      leftControl.classList.add('arrow-hidden');
      platform.classList.remove('left-fader');
    } else {
      leftControl.classList.remove('arrow-hidden');
      platform.classList.add('left-fader');
    }
  };
  // Right intersection observers to toggle right arrow and gradient
  const onLastSlideIntersect = ([entry]) => {
    if (isInHiddenSection()) return;
    if (entry.isIntersecting) {
      rightControl.classList.add('arrow-hidden');
      platform.classList.remove('right-fader');
    } else {
      rightControl.classList.remove('arrow-hidden');
      platform.classList.add('right-fader');
    }
  };

  const options = { threshold: 0, root: parent };
  const firstSlideObserver = new IntersectionObserver(onFirstSlideIntersect, options);
  const lastSlideObserver = new IntersectionObserver(onLastSlideIntersect, options);
  firstSlideObserver.observe(leftTrigger);
  lastSlideObserver.observe(rightTrigger);
  // todo: should unobserve triggers where/when appropriate...
}

export default async function buildCarousel(selector, parent, options = {}) {
  // Load CSS
  loadCSS('/express/blocks/shared/carousel.css');
  // Build the carousel HTML
  const carouselContent = selector ? parent.querySelectorAll(selector) : parent.querySelectorAll(':scope > *');

  carouselContent.forEach((el) => el.classList.add('carousel-element'));

  const container = createTag('div', { class: 'carousel-container' });
  const platform = createTag('div', { class: 'carousel-platform' });

  const leftTrigger = createTag('div', { class: 'carousel-left-trigger' });
  const rightTrigger = createTag('div', { class: 'carousel-right-trigger' });

  const faderLeft = createTag('div', { class: 'carousel-fader-left arrow-hidden' });
  const faderRight = createTag('div', { class: 'carousel-fader-right arrow-hidden' });

  const arrowLeft = createTag('a', { class: 'button carousel-arrow carousel-arrow-left' });
  const arrowRight = createTag('a', { class: 'button carousel-arrow carousel-arrow-right' });

  platform.append(leftTrigger, ...carouselContent, rightTrigger);
  container.append(platform, faderLeft, faderRight);
  faderLeft.append(arrowLeft);
  faderRight.append(arrowRight);
  parent.appendChild(container);

  // If flex container has a gap, add negative margins to compensate
  const gap = window.getComputedStyle(platform, null).getPropertyValue('gap');
  if (gap !== 'normal') {
    const gapInt = parseInt(gap.replace('px', ''), 10);
    leftTrigger.style.marginRight = `-${gapInt + 1}px`;
    rightTrigger.style.marginLeft = `-${gapInt + 1}px`;
  }

  // Scroll the carousel by clicking on the controls
  const moveCarousel = (increment) => {
    platform.scrollLeft -= increment;
  };

  faderLeft.addEventListener('click', () => {
    const increment = Math.max((platform.offsetWidth / 4) * 3, 300);
    moveCarousel(increment);
  });
  faderRight.addEventListener('click', () => {
    const increment = Math.max((platform.offsetWidth / 4) * 3, 300);
    moveCarousel(-increment);
  });

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
    if (opts.infinityScrollEnabled) {
      infinityScroll([...carouselContent]);
      faderLeft.classList.remove('arrow-hidden');
      faderRight.classList.remove('arrow-hidden');
      platform.classList.add('left-fader', 'right-fader');
    }

    const onIntersect = ([entry], observer) => {
      if (!entry.isIntersecting) return;

      if (opts.centerAlign) correctCenterAlignment(scrollable);
      if (opts.startPosition === 'right') moveCarousel(-scrollable.scrollWidth);
      if (!opts.infinityScrollEnabled) initToggleTriggers(container);

      observer.unobserve(scrollable);
    };

    const carouselObserver = new IntersectionObserver(onIntersect, { threshold: 0 });
    carouselObserver.observe(scrollable);
  };

  setInitialState(platform, options);
}
