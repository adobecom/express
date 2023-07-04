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
  getOffer,
} from '../../scripts/scripts.js';

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

    if (planUrl.includes('/sp/')) {
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

    if (plan.offerId === '70C6FDFC57461D5E449597CC8F327CF1'
|| plan.offerId === 'CFB1B7F391F77D02FE858C43C4A5C64F') {
      plan.frequency = 'Monthly';
    } else if (plan.offerId === 'E963185C442F0C5EEB3AE4F4AAB52C24'
|| plan.offerId === 'BADDACAB87D148A48539B303F3C5FA92') {
      plan.frequency = 'Annual';
    } else {
      plan.frequency = null;
    }

    const countryOverride = new URLSearchParams(window.location.search).get('country');
    const offer = await getOffer(plan.offerId, countryOverride);

    if (offer) {
      plan.currency = offer.currency;
      plan.price = offer.unitPrice;
      plan.formatted = `${offer.unitPriceCurrencyFormatted}`;
      plan.country = offer.country;
      plan.vatInfo = offer.vatInfo;
      plan.language = offer.lang;
      plan.rawPrice = offer.unitPriceCurrencyFormatted.match(/[\d\s,.+]+/g);
      plan.prefix = offer.prefix ?? '';
      plan.suffix = offer.suffix ?? '';
      plan.formatted = plan.formatted.replace(plan.rawPrice[0],
        `<strong>${plan.prefix}${plan.rawPrice[0]}${plan.suffix}</strong>`);

      if (plan.name !== 'Free') {
        plan.formatted += '*';
      }
    }

    window.pricingPlans[planUrl] = plan;
  }

  return plan;
}

function getColumns(block, className) {
  const container = block.children[0];
  container.classList.add(className);

  return container;
}

function removeEmptyColumns(pricingContainer) {
  const columns = Array.from(pricingContainer.children);
  if (!columns[2].hasChildNodes()) {
    columns[2].remove();
  }
}

function handleHeader(column, columnNumber) {
  column.classList.add('pricing-column', `column-${columnNumber + 1}`);
  const title = column.querySelector('h2');
  const icon = column.querySelector('picture');
  const header = createTag('div', { class: 'pricing-header' });
  header.append(title, icon);
  return header;
}

function handlePrice(column) {
  const price = column.querySelector('[title="{{pricing}}"]');
  const priceContainer = price.parentNode;
  const plan = priceContainer.nextElementSibling;

  const priceText = createTag('div', { class: 'pricing-price' });
  const pricePlan = createTag('div', { class: 'pricing-plan' });
  pricePlan.append(priceText, plan);

  fetchPlan(price.href).then((response) => {
    priceText.innerHTML = response.formatted;
  });

  priceContainer.remove();

  return pricePlan;
}

function handleSpacer() {
  return createTag('div', { class: 'spacer' });
}

function handleCtas(column) {
  const ctaContainers = column.querySelectorAll('.button-container');

  const ctas = column.querySelectorAll('a');
  if (ctas.length > 1) {
    ctas[0].classList.add('details-cta');
    ctas[1].classList.add('cta', 'xlarge');
  } else {
    ctas[0].classList.add('cta', 'xlarge');
  }

  ctaContainers.forEach((container) => {
    if (container.children[0].matches('em')) {
      container.children[0].children[0].classList.add('secondary', 'dark');
    }
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

function cleanEmptyParagraphs(column) {
  column.querySelectorAll('p').forEach((p) => {
    if (p.textContent.trim() === '') {
      p.remove();
    }
  });
}

function handleColumn(column) {
  const header = handleHeader(column);
  const pricePlan = handlePrice(column);
  const cta = handleCtas(column);
  const description = handleDescription(column);
  const spacer = handleSpacer();

  column.append(header, description, spacer, pricePlan, cta);
  cleanEmptyParagraphs(column);
}

function processColumns(pricingContainer) {
  const columns = Array.from(pricingContainer.children);

  columns.forEach((column) => {
    handleColumn(column);
  });
}

export default function decorate(block) {
  const pricingContainer = getColumns(block, 'pricing-container');
  removeEmptyColumns(pricingContainer);

  processColumns(pricingContainer);
}
