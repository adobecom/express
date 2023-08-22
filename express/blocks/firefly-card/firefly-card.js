/*
 * Copyright 2023 Adobe. All rights reserved.
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

const buildMockInputField = (block) => {
  const textSpan = createTag('span', { class: 'mock-text' });
  textSpan.textContent = 'Crazy guy in spacesuit'
  const textDiv = createTag('div', { class: 'mock-text-wrapper' });
  textDiv.append(textSpan);
  block.append(textDiv);
};

export default function decorate(block) {
  const inputRows = Array.from(block.querySelectorAll(':scope > div'));
  const heading = inputRows.shift().querySelector('h2');
  const ctaText = inputRows.pop().textContent.trim();
  const cardDetails = inputRows.map((row) => {
    const text = row.querySelector('div').textContent.trim();
    const photo = row.querySelector('picture');
    return { text, photo };
  });
  block.innerHTML = '';

  buildMockInputField(block);
  block.append(cardDetails[0].photo);
}
