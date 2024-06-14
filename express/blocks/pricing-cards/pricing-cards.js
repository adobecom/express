import { addTempWrapper } from '../../scripts/decorate.js';
import {
  createTag,
  fetchPlaceholders, 
} from '../../scripts/utils.js'; 

import {
  formatDynamicCartLink,
  formatSalesPhoneNumber,
  shallSuppressOfferEyebrowText,
  fetchPlanOnePlans,
} from '../../scripts/utils/pricing.js';

import createToggle, { tagFreePlan } from './pricing-toggle.js';
import { handleTooltip } from './pricing-tooltip.js';

const blockKeys = [
  'header',
  'borderParams',
  'explain',
  'mPricingRow',
  'mCtaGroup',
  'yPricingRow',
  'yCtaGroup',
  'featureList',
  'compare',
];

const SAVE_PERCENTAGE = '{{savePercentage}}';
const SALES_NUMBERS = '{{business-sales-numbers}}';
const PRICE_TOKEN = '{{pricing}}';
const YEAR_2_PRICING_TOKEN = '[[year-2-pricing-token]]';

function suppressOfferEyebrow(specialPromo) {
  if (specialPromo.parentElement) {
    specialPromo.className = 'hide';
    specialPromo.parentElement.className = '';
    specialPromo.parentElement.classList.add('card-border');
    specialPromo.remove();
  }
}

function getPriceElementSuffix(placeholders, placeholderArr, response) {
  return placeholderArr
    .map((phText) => {
      const key = phText.replace('{{', '').replace('}}', '');
      return key.includes('vat') && !response.showVat
        ? ''
        : placeholders?.[key] || '';
    })
    .join(' ');
}

function handleYear2PricingToken(pricingArea, y2p, priceSuffix) {
  try {
    const elements = pricingArea.querySelectorAll('p');
    const year2PricingToken = Array.from(elements).find(
      (p) => p.textContent.includes(YEAR_2_PRICING_TOKEN),
    );
    if (!year2PricingToken) return;
    if (y2p) {
      year2PricingToken.textContent = year2PricingToken.textContent.replace(
        YEAR_2_PRICING_TOKEN,
        `${y2p} ${priceSuffix}`,
      );
    } else {
      year2PricingToken.textContent = '';
    }
  } catch (e) {
    window.lana.log(e);
  }
}

function handleSpecialPromo(
  specialPromo,
  isPremiumCard,
  response,
) {
  if (specialPromo?.textContent.includes(SAVE_PERCENTAGE)) {
    const offerTextContent = specialPromo.textContent;
    const shouldSuppress = shallSuppressOfferEyebrowText(
      response.savePer,
      offerTextContent,
      isPremiumCard,
      true,
      response.offerId,
    );

    if (shouldSuppress) {
      suppressOfferEyebrow(specialPromo);
    } else {
      specialPromo.innerHTML = specialPromo.innerHTML.replace(
        SAVE_PERCENTAGE,
        response.savePer,
      );
    }
  }
  if (
    !isPremiumCard
    && specialPromo?.parentElement?.classList?.contains('special-promo')
  ) {
    specialPromo.parentElement.classList.remove('special-promo');
    if (specialPromo.parentElement.firstChild.innerHTML !== '') {
      specialPromo.parentElement.firstChild.remove();
    }
  }
}

function handleSavePercentage(savePercentElem, isPremiumCard, response) {
  if (savePercentElem) {
    const offerTextContent = savePercentElem.textContent;
    if (
      shallSuppressOfferEyebrowText(
        response.savePer,
        offerTextContent,
        isPremiumCard,
        true,
        response.offerId,
      )
    ) {
      savePercentElem.remove();
    } else {
      savePercentElem.innerHTML = savePercentElem.innerHTML.replace(
        SAVE_PERCENTAGE,
        response.savePer,
      );
    }
  }
}

function handlePriceSuffix(priceEl, priceSuffix, priceSuffixTextContent) {
  const parentP = priceEl.parentElement;
  if (parentP.children.length > 1) {
    Array.from(parentP.childNodes).forEach((node) => {
      if (node === priceEl) return;
      if (node.nodeName === '#text') {
        priceSuffix.append(node);
      } else {
        priceSuffix.before(node);
      }
    });
  } else {
    priceSuffix.textContent = priceSuffixTextContent;
  }
}

function handleRawPrice(price, basePrice, response) {
  price.innerHTML = response.formatted;
  basePrice.innerHTML = response.formattedBP || '';
  basePrice.innerHTML !== ''
    ? price.classList.add('price-active')
    : price.classList.remove('price-active');
}


async function createPricingSection(
  placeholders,
  pricingArea,
  ctaGroup,
  specialPromo,
  isMonthly = false
) {
  const pricingSection = createTag('div', { class: 'pricing-section' });
  pricingArea.classList.add('pricing-area');

  const offer = pricingArea.querySelector(':scope > p > em');
  if (offer) {
    offer.classList.add('card-offer');
    offer.parentElement.outerHTML = offer.outerHTML;
  }

  const priceEl = pricingArea.querySelector(`[title="${PRICE_TOKEN}"]`);
  const pricingBtnContainer = pricingArea.querySelector('.button-container');
  if (!pricingBtnContainer) return;
  if (!priceEl) return;

  const pricingSuffixTextElem = pricingBtnContainer.nextElementSibling;
  const placeholderArr = pricingSuffixTextElem.textContent?.split(' ');

  const priceRow = createTag('div', { class: 'pricing-row' });
  const price = createTag('span', { class: 'pricing-price' });
  const basePrice = createTag('span', { class: 'pricing-base-price' });
  const priceSuffix = createTag('div', { class: 'pricing-row-suf' });

  priceRow.append(basePrice, price, priceSuffix);

  const response = await fetchPlanOnePlans(priceEl?.href);
  const priceSuffixTextContent = getPriceElementSuffix(
    placeholders,
    placeholderArr,
    response,
  );

  const isPremiumCard = response.ooAvailable || false;
  const savePercentElem = pricingArea.querySelector('.card-offer');
  handleRawPrice(price, basePrice, response);
  handlePriceSuffix(priceEl, priceSuffix, priceSuffixTextContent);
  handleTooltip(pricingArea);
  handleSavePercentage(savePercentElem, isPremiumCard, response);
  handleSpecialPromo(specialPromo, isPremiumCard, response);
  handleYear2PricingToken(pricingArea, response.y2p, priceSuffixTextContent);

  priceEl?.parentNode?.remove();
  if (!priceRow) return;
  pricingArea.prepend(priceRow);
  pricingBtnContainer?.remove();
  pricingSuffixTextElem?.remove();

  ctaGroup.classList.add('card-cta-group');
  ctaGroup.querySelectorAll('a').forEach((a, i) => {
    a.classList.add('large');
    if (i === 1) a.classList.add('secondary');
    if (a.parentNode.tagName.toLowerCase() === 'strong') {
      a.classList.add('button', 'primary');
      a.parentNode.remove();
    }
    if (a.parentNode.tagName.toLowerCase() === 'p') {
      a.parentNode.remove();
    }
    formatDynamicCartLink(a);
    ctaGroup.append(a);
  });

  if (isMonthly) {
    pricingSection.classList.add('monthly');
  } else {
    pricingSection.classList.add('annually', 'hide');
  }

  pricingSection.append(pricingArea);
  pricingSection.append(ctaGroup);
  return pricingSection;
}

function decorateSpecialPromo(inputString, card) {
  if (!inputString) {
    return null;
  }

  // Pattern to find {{...}}
  const pattern = /\{\{(.*?)\}\}/g;
  const matches = Array.from(inputString.trim().matchAll(pattern));

  if (matches.length > 0) {
    const [token, promoType] = matches[matches.length - 1];
    const specialPromo = createTag('div', { class: 'promo-tag' });
    specialPromo.textContent = inputString.split(token)[0].trim();
    card.classList.add(promoType.replaceAll(' ', ''));
    card.append(specialPromo);

    return specialPromo;
  }
  return null;
}

function decorateHeader(header, card) {
  const h2 = header.querySelector('h2');
  // The raw text extracted from the word doc
  header.classList.add('card-header');
  const premiumIcon = header.querySelector('img');
  // Finds the headcount, removes it from the original string and creates an icon with the hc
  const extractHeadCountExp = /(>?)\(\d+(.*?)\)/;
  if (! extractHeadCountExp.test(h2.innerText)) {
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
  card.append(header);
}

function decorateBasicTextSection(textElement, className, card) {
  if (!textElement.innerHTML.trim()) return
  textElement.classList.add(className);
  card.append(textElement);
}

// Links user to page where plans can be compared
function decorateCompareSection(compare, el, card) {
  if (!compare?.innerHTML.trim()) return
  compare.classList.add('card-compare');
  compare.querySelector('a')?.classList.remove('button', 'accent');
  // in a tab, update url
  const closestTab = el.closest('div.tabpanel');
  if (closestTab) {
    try {
      const tabId = parseInt(closestTab.id.split('-').pop(), 10);
      const compareLink = compare.querySelector('a');
      const url = new URL(compareLink.href);
      url.searchParams.set('tab', tabId);
      compareLink.href = url.href;
    } catch (e) {
      lana.log(e)
    }
  }
  card.append(compare);

}

// In legacy versions, the card element encapsulates all content
// In new versions, the cardBorder element encapsulates all content instead
async function decorateCard({
  header,
  borderParams,
  explain,
  mPricingRow,
  mCtaGroup,
  yPricingRow,
  yCtaGroup,
  featureList,
  compare,
}, el, placeholders) {
  const card = createTag('div', { class: 'card' });
  const cardBorder = createTag('div', { class: 'card-border' });
  cardBorder.append(card)
  console.log(borderParams)
  decorateHeader(header, card);
  decorateBasicTextSection(explain, 'card-explain', card);

  const [mPricingSection, yPricingSection] = await Promise.all([
    createPricingSection(card, placeholders, mPricingRow, mCtaGroup, null, true),
    createPricingSection(card, placeholders, yPricingRow, yCtaGroup, null),
  ]);

  const groupID = `${Date.now()}:${header.textContent.replace(/\s/g, '').trim()}`;
  const toggle = createToggle(placeholders, [mPricingSection, yPricingSection], groupID)
  card.append(toggle, mPricingSection, yPricingSection);
  decorateBasicTextSection(featureList, 'card-feature-list', card);
  decorateCompareSection(compare, el, card);
  return cardBorder
}

async function handlePhoneNumber(cardsContainer) {

  const phoneNumberTags = [...cardsContainer.querySelectorAll('a')].filter(
    (a) => a.title.includes(SALES_NUMBERS),
  );
  if (phoneNumberTags.length > 0) {
    await formatSalesPhoneNumber(phoneNumberTags, SALES_NUMBERS);
  }

}

export default async function init(el) {
  addTempWrapper(el, 'pricing-cards');

  const divs = blockKeys.map((_, index) => el.querySelectorAll(`:scope > div:nth-child(${index + 1}) > div`));
  const cards = Array.from(divs[0]).map((_, index) => blockKeys.reduce((obj, key, keyIndex) => {
    obj[key] = divs[keyIndex][index];
    return obj;
  }, {}));
  el.querySelectorAll(':scope > div:not(:last-of-type)').forEach((d) => d.remove());

  const cardsContainer = createTag('div', { class: 'cards-container' });
  const placeholders = await fetchPlaceholders();
  const decoratedCards = await Promise.all(

    cards.map((card) => decorateCard(card, el, placeholders)),
  );
  decoratedCards.forEach((card) => cardsContainer.append(card));

  await handlePhoneNumber(cardsContainer)

  el.classList.add('no-visible');
  el.prepend(cardsContainer);

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        el.classList.remove('no-visible');
      }
    });
  });

  observer.observe(el);
  tagFreePlan(cardsContainer);
}
