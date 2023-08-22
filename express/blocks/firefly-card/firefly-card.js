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
  textSpan.textContent = 'Crazy guy in spacesuit';
  const textDiv = createTag('div', { class: 'mock-text-wrapper' });
  textDiv.append(textSpan);
  block.append(textDiv);
};

const buildPayload = (block) => {
  const inputRows = Array.from(block.querySelectorAll(':scope > div'));
  block.innerHTML = '';
  const payload = {
    heading: inputRows.shift().querySelector('h3'),
    link: inputRows.at(-1).querySelector('a').href,
    ctaText: inputRows.pop().textContent.trim(),
    cards: inputRows.map((row) => {
      const text = row.querySelector('div').textContent.trim();
      const photo = row.querySelector('picture');
      return { text, photo };
    }),
  };
  return payload;
};

const buildCard = (block, payload) => {
  const aTag = createTag('a');
  const cta = createTag('a', { class: 'cta' });
  const textSpan = createTag('span', { class: 'mock-text' });
  const textDiv = createTag('div', { class: 'mock-text-wrapper' });

  aTag.href = payload.link;
  textSpan.textContent = 'Crazy guy in spacesuit';
  textDiv.append(textSpan);
  cta.textContent = payload.ctaText;
  aTag.append(payload.cards[0].photo, payload.heading, textDiv, cta);
  block.append(aTag);
};

export default function decorate(block) {
  const payload = buildPayload(block);
  console.log(payload);
  buildCard(block, payload);
  // buildMockInputField(block);
  // block.append(payload.cards[0].photo);
}
