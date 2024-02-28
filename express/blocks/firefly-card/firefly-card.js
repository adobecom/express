import { createTag, getMetadata } from '../../scripts/utils.js';
import BlockMediator from '../../scripts/block-mediator.min.js';

const typeWord = (textSpan, word, textWrapper, cta) => new Promise((resolve) => {
  const typingSpeed = 100;
  const minTextSpanHeight = 28;

  for (let i = 0; i < word.length; i += 1) {
    setTimeout(() => {
      textSpan.insertAdjacentHTML('beforeEnd', word[i]);
      if (textSpan.scrollHeight > minTextSpanHeight && !textWrapper.classList.contains('stacked')) {
        textWrapper.append(cta);
        textWrapper.classList.add('stacked');
      }
      if (i === word.length - 1) resolve();
    }, typingSpeed * (i + 1));
  }
});

const eraseWord = (textSpan, textWrapper, cta) => new Promise((resolve) => {
  const eraseSpeed = 20;
  const minTextSpanHeight = 30;
  const aTag = textWrapper.closest('a');
  for (let i = 0; i < textSpan.textContent.length; i += 1) {
    setTimeout(() => {
      textSpan.textContent = textSpan.textContent.slice(0, -1);
      if (textSpan.scrollHeight <= minTextSpanHeight && textWrapper.classList.contains('stacked')) {
        aTag.append(cta);
        textWrapper.classList.remove('stacked');
      }
      if (textSpan.textContent.length === 0) resolve();
    }, eraseSpeed * (i + 1));
  }
});

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const initCycleCards = async (block, payload) => {
  const textSpan = block.querySelector('.mock-text');
  const typingDelay = 1000;
  const eraseDelay = 2000;
  const textWrapper = block.querySelector('.mock-text-wrapper');
  const cta = block.querySelector('.mock-text-wrapper + a');
  const photos = block.querySelectorAll('picture');

  const animateCard = async (card) => {
    await sleep(typingDelay);
    await typeWord(textSpan, card.text, textWrapper, cta);
    card.photo.classList.add('show');
    photos.forEach((photo) => {
      if (photo !== card.photo) photo.classList.remove('show');
    });
    await sleep(eraseDelay);
    await eraseWord(textSpan, textWrapper, cta);
  };

  while (payload.playing) {
    for (const card of payload.cards) {
      // eslint-disable-next-line no-await-in-loop
      await animateCard(card);
    }
  }
};

const buildPayload = (block) => {
  const inputRows = Array.from(block.querySelectorAll(':scope > div'));
  block.innerHTML = '';
  return {
    heading: inputRows.shift().querySelector('h3'),
    link: inputRows.at(-1).querySelector('a').href,
    cta: inputRows.pop().querySelector('a'),
    cards: inputRows.map((row) => {
      const text = row.querySelector('div').textContent.trim();
      const photo = row.querySelector('picture');
      return { text, photo };
    }),
    playing: true,
  };
};

const buildCard = (block, payload) => {
  const aTag = createTag('a', { class: 'a-tag-wrapper' });
  const textSpan = createTag('span', { class: 'mock-text' });
  const textDiv = createTag('div', { class: 'mock-text-wrapper' });

  payload.cards[4].photo.classList.add('show');
  aTag.href = payload.link;
  textDiv.append(textSpan);
  payload.cards.forEach((card) => aTag.append(card.photo));
  aTag.append(payload.heading, textDiv, payload.cta);
  block.append(aTag);
};

export default async function decorate(block) {
  if (['yes', 'on', 'true'].includes(getMetadata('rush-beta-gating')) && ['yes', 'true', 'on'].includes(getMetadata('mobile-benchmark').toLowerCase()) && document.body.dataset.device === 'mobile') {
    let resolvePromise;
    const eligibility = BlockMediator.get('mobileBetaEligibility');
    const awaitGatingResult = new Promise((resolve) => {
      resolvePromise = resolve;
    });

    if (!eligibility) {
      const unsub = BlockMediator.subscribe('mobileBetaEligibility', (e) => {
        resolvePromise(e.newValue.deviceSupport);
        unsub();
      });
    } else {
      resolvePromise(eligibility.deviceSupport);
    }

    const eligible = await awaitGatingResult;
    if (eligible) {
      block.remove();
      return;
    }
  }

  const payload = buildPayload(block);
  buildCard(block, payload);
  initCycleCards(block, payload);
}
