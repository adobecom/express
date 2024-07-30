import { addTempWrapper } from '../../scripts/decorate.js';
import {
  createTag,
  fetchPlaceholders,
} from '../../scripts/utils.js';

function decorateHeader(header, planExplanation) {
  const h2 = header.querySelector('h2')
  header.classList.add('card-header');
  const premiumIcon = header.querySelector('img');
  // Finds the headcount, removes it from the original string and creates an icon with the hc
  const extractHeadCountExp = /(>?)\(\d+(.*?)\)/;
  if (extractHeadCountExp.test(h2?.innerText)) {
    const headCntDiv = createTag('div', { class: 'head-cnt', alt: '' });
    const headCount = h2.innerText
      .match(extractHeadCountExp)[0]
      .replace(')', '')
      .replace('(', '');
    [h2.innerText] = h2.innerText.split(extractHeadCountExp);
    headCntDiv.textContent = headCount;
    headCntDiv.prepend(
      createTag('img', {
        src: '/express/icons/head-count.svg',
        alt: 'icon-head-count',
      }),
    );
    header.append(headCntDiv);
  }
  if (premiumIcon) h2.append(premiumIcon);
  header.querySelectorAll('p').forEach((p) => {
    if (p.innerHTML.trim() === '') p.remove();
  });
  planExplanation.classList.add('plan-explanation')
}

function decorateCardBorder(card, source) {
  if (!source?.textContent) {
    const newHeader = createTag('div', { class: 'promo-eyebrow-text' })
    card.appendChild(newHeader)
    return
  }
  const pattern = /\{\{(.*?)\}\}/g;
  const matches = Array.from(source.textContent?.matchAll(pattern));
  if (matches.length > 0) {
    const [token, promoType] = matches[matches.length - 1];
    card.classList.add(promoType.replaceAll(' ', ''));
    const newHeader = createTag('div', { class: 'promo-eyebrow-text' })
    newHeader.textContent = source.textContent.replace(pattern, '')
    card.appendChild(newHeader)
  }
  source.classList.add('none')
}

export default async function init(el) {
  addTempWrapper(el, 'pricing-cards');
  const rows = Array.from(el.querySelectorAll(":scope > div"))
  const cardCount = rows[0].children.length
  const cards = []

  for (let i = 0; i < cardCount; i += 1) {
    const card = createTag('div', { class: 'card' })
    decorateCardBorder(card, rows[1].children[0])
    decorateHeader(rows[0].children[0], rows[2].children[0])
    rows[3].children[0].classList.add("pricing-area-wrapper")
    rows[3].children[0].appendChild(createTag('div', {class : 'pricing-bar'})) 
    rows[4].children[0].classList.add('compare-all')
    for (let j = 0; j < rows.length; j += 1) {
      card.appendChild(rows[j].children[0])
    }
    cards.push(card)
  }
  el.innerHTML = ''
  for (let card of cards) {
    el.appendChild(card)
  }
}
