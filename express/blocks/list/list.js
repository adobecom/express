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
import { createTag } from '../../scripts/utils.js';

function decorateList(block) {
  const list = [];

  const rows = Array.from(block.children);
  rows.forEach((row) => {
    const cells = Array.from(row.children);
    const titleEl = cells[0];
    const textEl = cells[1];

    if (titleEl && textEl) {
      const title = titleEl.textContent.trim();
      const text = textEl.textContent.trim();
      list.push({
        title, text,
      });
    }
  });
  if (list.length > 0) {
    block.innerHTML = '';
    list.forEach((item) => {
      const { title, text } = item;
      const listItem = createTag('div', { class: 'item' });
      block.append(listItem);
      const titleEl = createTag('h3', { class: 'item-title' });
      titleEl.innerHTML = title;
      listItem.append(titleEl);
      const textEl = createTag('p', { class: 'item-text' });
      textEl.innerHTML = text;
      listItem.append(textEl);
    });
  }
}

export default async function decorate(block) {
  decorateList(block);

  const pricingLinks = block.querySelectorAll('a[title^="{{pricing"]');
  if (pricingLinks.length > 0) {
    const { decoratePricing } = await import('../../scripts/utils/pricing.js');
    decoratePricing(block);
  }
}
