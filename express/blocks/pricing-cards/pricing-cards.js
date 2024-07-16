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

import createToggle  from './pricing-toggle.js';
import { handleTooltip } from './pricing-tooltip.js';


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
  pricingSection,
  ctaGroup,
  specialPromo,
  isMonthly = false
) {
  const pricingArea = createTag('div', { class: 'pricing-area' })
  while (pricingSection?.firstChild) {
    pricingArea.appendChild(pricingSection.firstChild);
  }


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
  const ctaArea = createTag('div', { class: 'card-cta-group' })
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
    if (a.textContent.includes(SALES_NUMBERS)){
      formatSalesPhoneNumber([a], SALES_NUMBERS)
    }
    ctaArea.append(a);
  });

  if (isMonthly) {
    pricingArea.classList.add('monthly');
    ctaArea.classList.add('monthly')
  } else {
    pricingArea.classList.add('annually', 'hide');
    ctaArea.classList.add('annually', 'hide')
  }
  return [pricingArea, ctaArea]
}

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
  const a = "" + source?.textContent;
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
  const placeholders = await fetchPlaceholders();
  const rows = Array.from(el.querySelectorAll(":scope > div"))
  const cardCount = rows[0].children.length
  const cards = []

  const syncHeights = () => {
    if (window.screen.width < 600) return
    const rowCount = el.children[0].children.length 
    for (let j = 0; j < rowCount; j++) {
      let maxHeight = 0
      for (let i = 0; i < cardCount; i++) {
        const cell = el.children[i].children[j]
        if (cell.classList.contains('card-header') || cell.classList.contains('promo-eyebrow-text')) continue;
        const dimensions = cell.getBoundingClientRect()
        if (dimensions.height > 0) {
          cell.style = "height:" + dimensions.height +  "px"
        }
        if (dimensions.height > maxHeight) { 
          maxHeight = dimensions.height
        }
      }
      for (let i = 0; i < cardCount; i++) {
        if (maxHeight === 0) continue;
        const cell = el.children[i].children[j]
        cell.style = "height:" + maxHeight + "px"
      }
    }
  };

  for (let i = 0; i < cardCount; i += 1) {
    const card = createTag('div', { class: 'card' })
    decorateCardBorder(card, rows[1].children[0])
    decorateHeader(rows[0].children[0], rows[2].children[0])

    const [[m1, m2], [a1, a2]] = await Promise.all([
      createPricingSection(placeholders, rows[3].children[0], rows[4].children[0], rows[0].children[0], true),
      createPricingSection(placeholders, rows[5].children[0], rows[6].children[0], rows[0].children[0]),
    ]);

    rows[3].children[0].innerHTML = ''
    rows[3].children[0].appendChild(m1)
    rows[3].children[0].appendChild(a1)
    rows[4].children[0].innerHTML = ''
    rows[4].children[0].appendChild(m2)
    rows[4].children[0].appendChild(a2)

    const groupID = `${Date.now()}`;
    const toggle = createToggle(placeholders, [m1, m2, a1, a2], groupID,syncHeights)
    rows[3].children[0].insertBefore(toggle,rows[3].children[0].children[0])
    rows[7].children[0].classList.add('card-feature-list')

    for (let j = 0; j < rows.length - 1; j += 1) {
      card.appendChild(rows[j].children[0])
    }
    cards.push(card)
  }
  el.innerHTML = ''
  for (let card of cards) {
    el.appendChild(card)
  }
 
  document.addEventListener('load', () => {
    syncHeights();
  }, 100);

  const observer = new IntersectionObserver((entries) => {
    syncHeights();
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        el.classList.remove('no-visible');
      }
    });
  });

  observer.observe(el);
}
