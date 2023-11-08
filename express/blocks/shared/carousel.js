/*
 * Copyright 2021 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

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

  const platform = parent.querySelector('.carousel-platform');
  const leftControl = parent.querySelector('.carousel-fader-left');
  const rightControl = parent.querySelector('.carousel-fader-right');

  const leftTrigger = createTag('div', { class: 'carousel-left-trigger' });
  const rightTrigger = createTag('div', { class: 'carousel-right-trigger' });

  // If flex container has a gap, add negative margins to compensate
  const gap = window.getComputedStyle(platform, null).getPropertyValue('gap');
  if (gap !== 'normal') {
    const gapInt = parseInt(gap.replace('px', ''), 10);
    leftTrigger.style.marginRight = `-${gapInt + 1}px`;
    rightTrigger.style.marginLeft = `-${gapInt + 1}px`;
  }

  platform.prepend(leftTrigger);
  platform.append(rightTrigger);

  // Left intersection observers to toggle left arrow and gradient
  const onFirstSlideIntersect = (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        leftControl.classList.add('arrow-hidden');
        platform.classList.remove('left-fader');
      } else {
        leftControl.classList.remove('arrow-hidden');
        platform.classList.add('left-fader');
      }
    });
  };
  // Right intersection observers to toggle right arrow and gradient
  const onLastSlideIntersect = (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        rightControl.classList.add('arrow-hidden');
        platform.classList.remove('right-fader');
      } else {
        rightControl.classList.remove('arrow-hidden');
        platform.classList.add('right-fader');
      }
    });
  };
  const firstSlideObserver = new IntersectionObserver(onFirstSlideIntersect, { threshold: 0 });
  const lastSlideObserver = new IntersectionObserver(onLastSlideIntersect, { threshold: 0 });
  firstSlideObserver.observe(leftTrigger);
  lastSlideObserver.observe(rightTrigger);
  // should unobserve triggers where/when appropriate...
}

export default async function buildCarousel(selector, parent, options = {}) {
  // Load CSS
  loadCSS('/express/blocks/shared/carousel.css');
  // Build the carousel HTML
  const carouselContent = selector ? parent.querySelectorAll(selector) : parent.querySelectorAll(':scope > *');
  carouselContent.forEach((el) => el.classList.add('carousel-element'));
  const container = createTag('div', { class: 'carousel-container' });
  const platform = createTag('div', { class: 'carousel-platform' });
  platform.append(...carouselContent);
  container.appendChild(platform);

  const faderLeft = createTag('div', { class: 'carousel-fader-left arrow-hidden' });
  const faderRight = createTag('div', { class: 'carousel-fader-right arrow-hidden' });
  container.appendChild(faderLeft);
  container.appendChild(faderRight);

  const arrowLeft = createTag('a', { class: 'button carousel-arrow carousel-arrow-left' });
  const arrowRight = createTag('a', { class: 'button carousel-arrow carousel-arrow-right' });
  faderLeft.append(arrowLeft);
  faderRight.append(arrowRight);

  parent.appendChild(container);

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
    } else {
      initToggleTriggers(container);
    }

    const onIntersect = (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        if (opts.centerAlign) correctCenterAlignment(scrollable);
        if (opts.startPosition === 'right') moveCarousel(-scrollable.scrollWidth);
        observer.unobserve(scrollable);
      });
    };

    const carouselObserver = new IntersectionObserver(onIntersect, { threshold: 0 });
    carouselObserver.observe(scrollable);
  };

  setInitialState(platform, options);
}
