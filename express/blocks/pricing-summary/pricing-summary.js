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
import { getOffer } from '../../scripts/utils/pricing.js';

async function fetchPlan(planUrl) {
  if (!window.pricingPlans) {
    window.pricingPlans = {};
  }

  let plan = window.pricingPlans[planUrl];

  if (!plan) {
    plan = {};
    const link = new URL(planUrl);
    const params = link.searchParams;

    plan.url = planUrl;
    plan.country = 'us';
    plan.language = 'en';
    plan.price = '9.99';
    plan.currency = 'US';
    plan.symbol = '$';

    // TODO: Remove '/sp/ once confirmed with stakeholders
    const allowedHosts = ['new.express.adobe.com', 'express.adobe.com', 'adobesparkpost.app.link'];
    const { host } = new URL(planUrl);
    if (allowedHosts.includes(host) || planUrl.includes('/sp/')) {
      plan.offerId = 'FREE0';
      plan.frequency = 'monthly';
      plan.name = 'Free';
      plan.stringId = 'free-trial';
    } else {
      plan.offerId = params.get('items[0][id]');
      plan.frequency = null;
      plan.name = 'Premium';
      plan.stringId = '3-month-trial';
    }

    if (plan.offerId === '70C6FDFC57461D5E449597CC8F327CF1' || plan.offerId === 'CFB1B7F391F77D02FE858C43C4A5C64F') {
      plan.frequency = 'Monthly';
    } else if (plan.offerId === 'E963185C442F0C5EEB3AE4F4AAB52C24' || plan.offerId === 'BADDACAB87D148A48539B303F3C5FA92') {
      plan.frequency = 'Annual';
    } else {
      plan.frequency = null;
    }

    const countryOverride = new URLSearchParams(window.location.search).get('country');
    const offer = await getOffer(plan.offerId, countryOverride);

    if (offer) {
      plan.currency = offer.currency;
      plan.price = offer.unitPrice;
      plan.basePrice = offer.basePrice;
      plan.country = offer.country;
      plan.vatInfo = offer.vatInfo;
      plan.language = offer.lang;
      plan.rawPrice = offer.unitPriceCurrencyFormatted.match(/[\d\s,.+]+/g);
      plan.prefix = offer.prefix ?? '';
      plan.suffix = offer.suffix ?? '';
      plan.formatted = offer.unitPriceCurrencyFormatted.replace(
        plan.rawPrice[0],
        `<strong>${plan.prefix}${plan.rawPrice[0]}</strong>`,
      );

      if (offer.basePriceCurrencyFormatted) {
        plan.rawBasePrice = offer.basePriceCurrencyFormatted.match(/[\d\s,.+]+/g);
        plan.formattedBP = offer.basePriceCurrencyFormatted.replace(
          plan.rawBasePrice[0],
          `<strong>${plan.prefix}${plan.rawBasePrice[0]}</strong>`,
        );
      }
    }

    window.pricingPlans[planUrl] = plan;
  }

  return plan;
}

function handleHeader(column) {
  column.classList.add('pricing-column');

  const title = column.querySelector('h2');
  const icon = column.querySelector('img');
  const header = createTag('div', { class: 'pricing-header' });

  header.append(title, icon);

  return header;
}

function handlePrice(column) {
  const pricePlan = createTag('div', { class: 'pricing-plan' });
  const priceEl = column.querySelector('[title="{{pricing}}"]');
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
    container.querySelector('em')?.children[0]?.classList.add('secondary', 'dark');
  });

  return ctaContainers[ctaContainers.length - 1];
}

function handleDescription(column) {
  const description = createTag('div', { class: 'pricing-description' });
  const texts = [...column.children];

  texts.pop();

  description.append(...texts);

  return description;
}

function alignContent(block) {
  const contentWrappers = block.querySelectorAll('.pricing-content-wrapper');
  const elementsMinHeight = {
    'pricing-header': 0,
    'pricing-description': 0,
    'pricing-plan': 0,
  };
  let attemptsLeft = 10;

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
  const pricingContainer = block.children[1];
  pricingContainer.classList.add('pricing-container');
  const columnsContainer = createTag('div', { class: 'columns-container' });
  const columns = Array.from(pricingContainer.children);
  pricingContainer.append(columnsContainer);
  const cardsLoaded = [];
  columns.forEach((column) => {
    const cardLoaded = new Promise((resolve) => {
      const contentWrapper = createTag('div', { class: 'pricing-content-wrapper' });
      const header = handleHeader(column);
      const pricePlan = handlePrice(column);
      const cta = handleCtas(column);
      const description = handleDescription(column);

      contentWrapper.append(header, description, pricePlan);
      column.append(contentWrapper, cta);
      columnsContainer.append(column);
      resolve();
    });
    cardsLoaded.push(cardLoaded);
  });

  await Promise.all(cardsLoaded).then(() => {
    alignContent(block);
  });
}
