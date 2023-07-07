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
import { fetchPlan } from '../plans-comparison/plans-comparison.js';

function handleHeader(column) {
  column.classList.add('pricing-column');
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

export default function decorate(block) {
  const pricingContainer = block.children[0];
  pricingContainer.classList.add('pricing-container');

  const columns = Array.from(pricingContainer.children);
  columns.forEach((column) => {
    const header = handleHeader(column);
    const pricePlan = handlePrice(column);
    const cta = handleCtas(column);
    const description = handleDescription(column);
    const spacer = createTag('div', { class: 'spacer' });

    column.append(header, description, spacer, pricePlan, cta);
    cleanEmptyParagraphs(column);
  });
}
