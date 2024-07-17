// import { decorateButtons } from '../../utils/decorate.js';
import { decorateButtons } from '../../scripts/utils/decorate.js';

// import { loadStyle, getConfig } from '../../utils/utils.js';
import { loadStyle, getConfig } from '../../scripts/utils.js';

import { addBackgroundImg, addWrapper, addFooter, addVideoBtn } from './cardUtils.js';

import { createTag } from '../../scripts/utils.js';

console.log("IN card.js")

const HALF = 'OneHalfCard';
const HALF_HEIGHT = 'HalfHeightCard';
const PRODUCT = 'ProductCard';
const DOUBLE_WIDE = 'DoubleWideCard';

const getCardType = (styles) => {
  const cardTypes = {
    'half-card': HALF,
    'half-height-card': HALF_HEIGHT,
    'product-card': PRODUCT,
    'double-width-card': DOUBLE_WIDE,
  };
  const authoredType = styles?.find((style) => style in cardTypes);
  return cardTypes[authoredType] || HALF;
};

const addInner = (el, cardType, card) => {
  const title = el.querySelector('h1, h2, h3, h4, h5, h6');
  const text = Array.from(el.querySelectorAll('p'))?.find((p) => !p.querySelector('picture, a'));
  let inner = el.querySelector(':scope > div:not([class])');

  if (cardType === DOUBLE_WIDE) {
    inner = document.createElement('a');
    inner.href = el.querySelector('a')?.href || '';
    inner.rel = 'noopener noreferrer';
    inner.tabIndex = 0;
    if (title) inner.append(title);
    if (text) inner.append(text);
    el.querySelector(':scope > div:not([class])')?.remove();
  }

  inner.classList.add(`consonant-${cardType}-inner`);
  card.append(inner);

  if (cardType === PRODUCT) {
    inner.querySelector(':scope > div')?.classList.add('consonant-ProductCard-row');
    if (text) inner.append(text);
  }

  if (cardType === HALF_HEIGHT) {
    text?.remove();
  }

  title?.classList.add(`consonant-${cardType}-title`);
  text?.classList.add(`consonant-${cardType}-text`);
};

const init = (el) => {
  console.log("COMING INTO INIT, named 'init'", el);
  // return;
  
  const { miloLibs, codeRoot } = getConfig();
  const base = miloLibs || codeRoot;
  loadStyle(`${base}/deps/caas.css`);

  console.log("INIT: Checkpoint 01");
  
// return;

  const section = el.closest('.section');
  section.classList.add('milo-card-section');
  const row = el.querySelector(':scope > div');
  const picture = el.querySelector('picture');
  const styles = Array.from(el.classList);
  const cardType = getCardType(styles);
  const merch = styles.includes('merch') && cardType === HALF;
  const links = merch ? el.querySelector(':scope > div > div > p:last-of-type')
    .querySelectorAll('a') : el.querySelectorAll('a:not(.consonant-play-btn)');
  let card = el;

  console.log("INIT: Checkpoint 02");
  
  addWrapper(el, section, cardType);

  console.log("INIT: Checkpoint 03");

  if (cardType === HALF_HEIGHT) {
    const [link] = links;

    if (link) {
      card = link;
    } else {
      card = document.createElement('a');
      card.href = '';
    }

    el.prepend(card);
  }

  card.classList.add('consonant-Card', `consonant-${cardType}`);
  if (!styles.includes('border')) card.classList.add('consonant-u-noBorders');

  if (picture && cardType !== PRODUCT) {
    addBackgroundImg(picture, cardType, card);
    const playBtn = el.querySelector('a.consonant-play-btn');
    if (playBtn) addVideoBtn(playBtn, cardType, card);
  }

  picture?.parentElement.remove();
  addInner(el, cardType, card);
  decorateButtons(el);

  if (cardType === HALF || cardType === PRODUCT) {
    addFooter(links, row, merch);
  }

  console.log("INIT: Checkpoint Last");
};

export default init;

// export default function decorate($block) {

//   console.log("COMING INTO decorate");

//   $block.querySelectorAll(':scope>div').forEach(($card) => {
//     $card.classList.add('card');
//     const $cardDivs = [...$card.children];
//     $cardDivs.forEach(($div) => {
//       if ($div.querySelector('img')) {
//         $div.classList.add('card-image');
//       } else {
//         $div.classList.add('card-content');
//       }
//       const $a = $div.querySelector('a');
//       if ($a && $a.textContent.trim().startsWith('https://')) {
//         const $wrapper = createTag('a', { href: $a.href, class: 'card' });
//         $a.remove();
//         $wrapper.innerHTML = $card.innerHTML;
//         $block.replaceChild($wrapper, $card);
//       }
//     });
//   });
// }

