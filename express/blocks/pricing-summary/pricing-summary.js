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

import { createTag } from '../../scripts/scripts.js';
import { fetchPlan, buildUrl } from '../../scripts/utils/pricing.js';
import { buildCarousel } from '../shared/carousel.js';

function handleHeader(column) {
  column.classList.add('pricing-column');

  const title = column.querySelector('h2');
  const icon = column.querySelector('img');
  const header = createTag('div', { class: 'pricing-header' });

  header.append(title, icon);

  return header;
}

function handlePrice(block, column) {
  const pricePlan = createTag('div', { class: 'pricing-plan' });
  const priceEl = column.querySelector('[title="{{pricing}}"]');
  if (!priceEl) return null;
  const priceParent = priceEl?.parentNode;
  const plan = priceParent?.nextElementSibling.querySelector('a') ? '' : priceParent?.nextElementSibling;

  const priceWrapper = createTag('div', { class: 'pricing-price-wrapper' });
  const price = createTag('span', { class: 'pricing-price' });
  const basePrice = createTag('span', { class: 'pricing-base-price' });
  const priceSuffix = createTag('div', { class: 'pricing-plan-suf' });

  priceWrapper.append(basePrice, price, priceSuffix);
  pricePlan.append(priceWrapper, plan);

  fetchPlan(priceEl?.href).then((response) => {
    price.innerHTML = response.formatted;
    basePrice.innerHTML = response.formattedBP || '';

    if (priceEl.nextSibling?.nodeName === '#text') {
      priceSuffix.textContent = priceEl.nextSibling?.textContent?.trim();
    } else {
      priceSuffix.textContent = response.suffix;
    }

    const planCTA = column.querySelector(':scope > .button-container:last-of-type a.button');
    if (planCTA) planCTA.href = buildUrl(response.url, response.country, response.language);

    if (+response.price > 0 && block.classList.contains('feature')) {
      column.parentElement.classList.add('monetize-item-background');
    }
  });

  priceParent?.remove();
  return pricePlan;
}

function handleCtas(column) {
  const ctaContainers = column.querySelectorAll('.button-container');

  const ctas = column.querySelectorAll('a');
  ctas[0]?.classList.add(ctas[1] ? 'details-cta' : 'cta', 'xlarge');
  ctas[1]?.classList.add('cta', 'xlarge');

  ctaContainers.forEach((container) => {
    container.querySelector('em')?.children[0]?.classList.add('primary');
    container.querySelector('strong')?.children[0]?.classList.add('secondary');
  });

  return ctaContainers[ctaContainers.length - 1];
}

function handleDescription(column) {
  const description = createTag('div', { class: 'pricing-description' });
  const texts = [...column.children].filter((element) => !element.querySelector('svg, img'));

  description.append(...texts);

  return description;
}

function handleFeatureList(featureColumns, index) {
  if (!featureColumns) return null;
  const featureList = featureColumns[index];
  featureList.classList.add('pricing-feature-list');
  return featureList;
}

function handleEyeBrows(columnWrapper, eyeBrowCols, index) {
  if (!eyeBrowCols) return null;
  if (!eyeBrowCols[index].children.length) {
    eyeBrowCols[index].remove();
    return null;
  }

  eyeBrowCols[index].classList.add('pricing-eyebrow');
  columnWrapper.classList.add('has-pricing-eyebrow');
  return eyeBrowCols[index];
}

function alignContent(block) {
  const contentWrappers = block.querySelectorAll('.pricing-content-wrapper');
  const elementsMinHeight = {
    'pricing-header': 0,
    'pricing-description': 0,
    'pricing-plan': 0,
  };
  let attemptsLeft = 10;
  const cardWidth = (430 * contentWrappers.length) + (20 * (contentWrappers.length - 1));
  const maxWidth = Math.min(cardWidth, 1440);
  block.style.maxWidth = `${maxWidth}px`;

  const minHeightCaptured = new Promise((resolve) => {
    const heightCatcher = setInterval(() => {
      if (Object.values(elementsMinHeight).every((h) => h > 0) || !attemptsLeft) {
        clearInterval(heightCatcher);
        resolve();
      }

      if (contentWrappers?.length > 0) {
        contentWrappers.forEach((wrapper) => {
          const childDivs = wrapper.querySelectorAll(':scope > div');
          if (childDivs?.length > 0) {
            childDivs.forEach((div) => {
              elementsMinHeight[div.className] = Math.max(
                elementsMinHeight[div.className],
                div.offsetHeight,
              );
            });
          }
        });
      }

      attemptsLeft -= 1;
    }, 10);
  });

  minHeightCaptured.then(() => {
    contentWrappers.forEach((wrapper) => {
      const childDivs = wrapper.querySelectorAll(':scope > div');
      if (childDivs?.length > 0) {
        childDivs.forEach((div) => {
          if (elementsMinHeight[div.className]
            && div.offsetHeight < elementsMinHeight[div.className]) {
            div.style.height = `${elementsMinHeight[div.className]}px`;
          }
        });
      }
    });
  });
}

export default async function decorate(block) {
  const pricingContainer = block.classList.contains('feature') ? block.children[2] : block.children[1];
  const featureColumns = block.classList.contains('feature') ? Array.from(block.children[3].children) : null;
  const eyeBrows = block.classList.contains('feature') ? Array.from(block.children[1].children) : null;
  pricingContainer.classList.add('pricing-container');
  const columnsContainer = createTag('div', { class: 'pricing-summary-columns-container' });
  const columns = Array.from(pricingContainer.children);
  pricingContainer.append(columnsContainer);
  const cardsLoaded = [];
  columns.forEach((column, index) => {
    const cardLoaded = new Promise((resolve) => {
      const columnWrapper = createTag('div', { class: 'pricing-column-wrapper' });
      columnWrapper.append(column);

      const contentWrapper = createTag('div', { class: 'pricing-content-wrapper' });
      const header = handleHeader(column);
      const pricePlan = handlePrice(block, column);
      const cta = handleCtas(column);
      const description = handleDescription(column);
      const featureList = handleFeatureList(featureColumns, index);
      const eyeBrow = handleEyeBrows(columnWrapper, eyeBrows, index);

      contentWrapper.append(header, description);
      if (pricePlan) {
        contentWrapper.append(pricePlan);
      } else {
        columnWrapper.classList.add('no-price-type');
      }
      column.append(contentWrapper, cta);
      if (featureList) column.append(featureList);
      if (eyeBrow) columnWrapper.prepend(eyeBrow);

      columnsContainer.append(columnWrapper);
      resolve();
    });

    cardsLoaded.push(cardLoaded);
  });

  await Promise.all(cardsLoaded).then(() => {
    alignContent(block);
    buildCarousel('.pricing-column-wrapper', columnsContainer);
  });
}
