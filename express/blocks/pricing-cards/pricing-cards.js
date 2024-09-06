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

import createToggle from './pricing-toggle.js';
import { handleTooltip, adjustElementPosition } from './pricing-tooltip.js';
import BlockMediator from '../../scripts/block-mediator.min.js';

const SAVE_PERCENTAGE = '{{savePercentage}}';
const SALES_NUMBERS = '{{business-sales-numbers}}';
const PRICE_TOKEN = '{{pricing}}';
const YEAR_2_PRICING_TOKEN = '[[year-2-pricing-token]]';

function getHeightWithoutPadding(element) {
  const styles = window.getComputedStyle(element);
  const paddingTop = parseFloat(styles.paddingTop);
  const paddingBottom = parseFloat(styles.paddingBottom);
  return element.clientHeight - paddingTop - paddingBottom;
}

function equalizeHeights(el) {
  const classNames = ['.card-header', '.plan-explanation', '.billing-toggle', '.pricing-area', '.card-cta-group'];
  const cardCount = el.querySelectorAll('.pricing-cards .card').length;
  if (cardCount === 1) return;
  for (const className of classNames) {
    const headers = el.querySelectorAll(className);
    let maxHeight = 0;
    headers.forEach((header) => {
      if (header.checkVisibility()) {
        const height = getHeightWithoutPadding(header);
        header.ATTRIBUTE_NODE;
        maxHeight = Math.max(maxHeight, height);
      }
    });
    headers.forEach((placeholder) => {
      if (placeholder.style.height) return;
      if (maxHeight > 0) { 
        placeholder.style.height = `${maxHeight}px`;
      }
    });
  }
}

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
      year2PricingToken.innerHTML = year2PricingToken.innerHTML.replace(
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
  console.log(specialPromo);
  specialPromo.classList.add('special-promo');
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
  pricingArea.classList.add('pricing-area');
  let offerId;
  const offer = pricingArea.querySelector(':scope > p > em');
  if (offer) {
    offer.classList.add('card-offer');
    offer.parentElement.outerHTML = offer.outerHTML;
  }

  const priceEl = pricingArea.querySelector(`[title="${PRICE_TOKEN}"]`);
  const pricingBtnContainer = pricingArea.querySelector('.button-container');

  if (pricingBtnContainer && priceEl) {
    const pricingSuffixTextElem = pricingBtnContainer.nextElementSibling;
    const placeholderArr = pricingSuffixTextElem.textContent?.split(' ');

    const priceRow = createTag('div', { class: 'pricing-row' });
    const price = createTag('span', { class: 'pricing-price' });
    const basePrice = createTag('span', { class: 'pricing-base-price' });
    const priceSuffix = createTag('div', { class: 'pricing-row-suf' });
    const response = await fetchPlanOnePlans(priceEl?.href);
    if (response.term) {
      BlockMediator.set(`${response.offerId}-planType`, response.term);
    }
    offerId = response.offerId;
    BlockMediator.set(offerId, parseInt(response.price,4));

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

    priceRow.append(basePrice, price, priceSuffix);
    pricingArea.prepend(priceRow);
    priceEl?.parentNode?.remove();
    pricingSuffixTextElem?.remove();
    pricingBtnContainer?.remove();
  }
  ctaGroup.classList.add('card-cta-group');
  ctaGroup.querySelectorAll('a').forEach((a, i) => {
    a.classList.add('large');
    if (i === 1) a.classList.add('secondary');
    if (a.parentNode.tagName.toLowerCase() === 'strong') {
      a.classList.add('button', 'primary');
    }
    formatDynamicCartLink(a);
    if (a.textContent.includes(SALES_NUMBERS)) {
      formatSalesPhoneNumber([a], SALES_NUMBERS);
    }
  });

  if (isMonthly) {
    pricingArea.classList.add('monthly');
    ctaGroup.classList.add('monthly');
  } else {
    pricingArea.classList.add('annually', 'hide');
    ctaGroup.classList.add('annually', 'hide');
  }
  return offerId;
}

function decorateHeader(header, planExplanation) {
  const h2 = header.querySelector('h2');
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
  planExplanation.classList.add('plan-explanation');
}

function decorateCardBorder(card, source) {
  source.classList.add('promo-eyebrow-text');
  const pattern = /\{\{(.*?)\}\}/g;
  const matches = Array.from(source.textContent?.matchAll(pattern));
  if (matches.length > 0) {
    const [, promoType] = matches[matches.length - 1];
    card.classList.add(promoType.replaceAll(' ', ''));
    source.textContent = source.textContent.replace(pattern, '');
  }
}

function decorateBillingToggle(card, cardIndex, placeholders, monthlyPlanID, yearlyPlanID) {
  const toggle = createToggle(placeholders, [card.children[3], card.children[4], card.children[5], card.children[6]], monthlyPlanID, yearlyPlanID);
  card.insertBefore(toggle, card.children[3]);
}

export default async function init(el) {
  addTempWrapper(el, 'pricing-cards');
  const placeholders = await fetchPlaceholders();
  const rows = Array.from(el.querySelectorAll(':scope > div'));
  const cardCount = rows[0].children.length;
  const cards = [];

  const firstRow = rows[0];
  rows.splice(0, 1);
  rows.splice(1, 0, firstRow);

  for (let cardIndex = 0; cardIndex < cardCount; cardIndex += 1) {
    const card = createTag('div', { class: 'card' });
    decorateCardBorder(card, rows[0].children[0]);
    decorateHeader(rows[1].children[0], rows[2].children[0]);
    const monthlyPlanID = await createPricingSection(placeholders, rows[3].children[0],
      rows[4].children[0], rows[0].children[0], true);
    const yearlyPlanID = await createPricingSection(placeholders, rows[5].children[0],
      rows[6].children[0], rows[0].children[0]);
    rows[7].children[0].classList.add('card-feature-list');
    rows[8].children[0].classList.add('compare-all');

    for (let j = 0; j < rows.length - 1; j += 1) {
      card.appendChild(rows[j].children[0]);
    }
    cards.push(card);
    decorateBillingToggle(card, cardIndex, placeholders, monthlyPlanID, yearlyPlanID);
  }

  el.innerHTML = '';
  el.appendChild(createTag('div', { class: 'card-wrapper' }));
  for (const card of cards) {
    el.children[0].appendChild(card);
  }
  el.appendChild(rows[rows.length - 1]);

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        equalizeHeights(el);
        observer.unobserve(entry.target);
        adjustElementPosition();
      }
    });
  });

  document.querySelectorAll('.card').forEach((column) => {
    observer.observe(column);
  });

  window.addEventListener('load', () => equalizeHeights(el));
  window.addEventListener('resize', () => equalizeHeights(el));
}
