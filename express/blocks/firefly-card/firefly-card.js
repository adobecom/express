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

const animateBlinkingCursor = async (textSpan) => {
  setInterval(() => {
    textSpan.classList.toggle('cursor-on');
  }, 600);
};

const typeWord = (textSpan, word) => new Promise((resolve) => {
  for (let i = 0; i < word.length; i += 1) {
    setTimeout(() => {
      textSpan.insertAdjacentHTML('beforeEnd', word[i]);
      if (i === word.length - 1) resolve();
    }, 100 * (i + 1));
  }
});

const eraseWord = (textSpan) => new Promise((resolve) => {
  for (let i = 0; i < textSpan.textContent.length; i += 1) {
    setTimeout(() => {
      textSpan.textContent = textSpan.textContent.slice(0, -1);
      if (textSpan.textContent.length === 0) resolve();
    }, 100 * (i + 1));
  }
});

const initTypingAnimation = async (block, payload) => {
  // const speed = 100;
  // const eraseSpeed = 20;
  // const typingDelay = 1000;
  // const eraseDelay = 2000;
  const textSpan = block.querySelector('.mock-text');

  animateBlinkingCursor(textSpan);

  for (const card of payload.cards) {
    console.log(card);
    await typeWord(textSpan, card.text);
    await eraseWord(textSpan);
    console.log('get here?');
  }
};
// textSpan.textContent = '';
// setTimeout(() => {
//   console.log(card.text, index);
//   textSpan.textContent = card.text;
// }, 1000 * (index + 1));
// });
// on each one add one letter at a time
// Then erase

const buildPayload = (block) => {
  const inputRows = Array.from(block.querySelectorAll(':scope > div'));
  block.innerHTML = '';
  const payload = {
    heading: inputRows.shift().querySelector('h3'),
    link: inputRows.at(-1).querySelector('a').href,
    cta: inputRows.pop().querySelector('a'),
    cards: inputRows.map((row) => {
      const text = row.querySelector('div').textContent.trim();
      const photo = row.querySelector('picture');
      return { text, photo };
    }),
  };
  return payload;
};

const buildCard = (block, payload) => {
  const aTag = createTag('a', { class: 'a-tag-wrapper' });
  const textSpan = createTag('span', { class: 'mock-text' });
  const textDiv = createTag('div', { class: 'mock-text-wrapper' });

  aTag.href = payload.link;
  // textSpan.textContent = '|';
  textDiv.append(textSpan);
  aTag.append(payload.cards[3].photo, payload.heading, textDiv, payload.cta);
  block.append(aTag);
};

export default function decorate(block) {
  const payload = buildPayload(block);
  buildCard(block, payload);
  initTypingAnimation(block, payload);
}
