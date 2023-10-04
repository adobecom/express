/*
 * Copyright 2022 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import buildCarousel from '../shared/carousel.js';

function decorateCarousel(links, container) {
  links.forEach((p) => {
    const link = p.querySelector('a');
    link.classList.add('small', 'secondary', 'fill');
    link.classList.remove('accent');
  });
  buildCarousel('p.button-container', container);
}

export default function decorate(block) {
  const links = [...block.querySelectorAll('p.button-container')];
  const seoCopy = block.querySelectorAll('div')[block.querySelectorAll('div').length - 1];
  const carouselDiv = block.querySelector('div:nth-of-type(2) > div');

  if (links.length) {
    decorateCarousel(links, carouselDiv);
  }

  if (seoCopy) {
    const $paragraphs = seoCopy.querySelectorAll('p');
    for (let i = 0; i < $paragraphs.length; i += 1) {
      $paragraphs[i].classList.add('seo-paragraph');
    }
  }

  const pillsUpdatedByCKG = (mutationList, observer) => {
    for (const mutation of mutationList) {
      if (mutation.type === 'childList') {
        if (carouselDiv.querySelector('.carousel-container')) {
          observer.disconnect();
          return;
        }

        const newLinks = [...block.querySelectorAll('p.button-container')];
        if (!newLinks.length) {
          carouselDiv.style.display = 'none';
        }
        decorateCarousel(newLinks, carouselDiv);
        observer.disconnect();
        return;
      }
    }
  };

  const observer = new MutationObserver(pillsUpdatedByCKG);
  observer.observe(carouselDiv, { childList: true });
}
