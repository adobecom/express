import { createTag, fetchPlaceholders } from '../../scripts/utils.js';
import {
  buildUrl, formatSalesPhoneNumber, setVisitorCountry,
  shallSuppressOfferEyebrowText, fetchPlanOnePlans,
} from '../../scripts/utils/pricing.js';
import BlockMediator from '../../scripts/block-mediator.min.js';

const blockKeys = ['header', 'borderParams', 'explain', 'mPricingRow', 'mCtaGroup', 'yPricingRow', 'yCtaGroup', 'featureList', 'compare'];
const plans = ['monthly', 'yearly']; // authored order should match with billing-radio
const BILLING_PLAN = 'billing-plan';

function handlePrice(placeholders, pricingArea, placeholderArr, specialPromo) {
  const priceRow = createTag('div', { class: 'pricing-row' });
  const priceEl = pricingArea.querySelector('[title="{{pricing}}"]');
  if (!priceEl) return null;
  const priceParent = priceEl?.parentNode;

  const price = createTag('span', { class: 'pricing-price' });
  const basePrice = createTag('span', { class: 'pricing-base-price' });
  const priceSuffix = createTag('div', { class: 'pricing-row-suf' });

  priceRow.append(basePrice, price, priceSuffix);

  fetchPlanOnePlans(priceEl?.href).then((response) => {
    let specialPromoPercentageEyeBrowTextReplaced = false;
    let pricingCardPercentageEyeBrowTextReplaced = false;
    const parentP = priceEl.parentElement;
    price.innerHTML = response.formatted;
    basePrice.innerHTML = response.formattedBP || '';
    if (basePrice.innerHTML !== '') {
      price.classList.add('price-active');
    } else {
      price.classList.remove('price-active');
    }
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
      const priceSuffixContent = placeholderArr.map((phText) => {
        const key = phText.replace('{{', '').replace('}}', '');
        return (key.includes('vat') && !response.showVat) ? '' : placeholders[key] || '';
      }).join(' ');
      priceSuffix.textContent = priceSuffixContent;
    }
    const isPremiumCard = response.ooAvailable || false;
    const savePercentElem = pricingArea.querySelector('.card-offer');
    if (savePercentElem && !pricingCardPercentageEyeBrowTextReplaced) {
      const offerTextContent = savePercentElem.textContent;
      if (shallSuppressOfferEyebrowText(response.savePer, offerTextContent, isPremiumCard,
        false, response.offerId)) {
        savePercentElem.remove();
      } else {
        savePercentElem.innerHTML = savePercentElem.innerHTML.replace('{{savePercentage}}', response.savePer);
        pricingCardPercentageEyeBrowTextReplaced = true;
      }
    }

    if (specialPromo && !specialPromoPercentageEyeBrowTextReplaced) {
      const offerTextContent = specialPromo.textContent;
      const shouldSuppress = shallSuppressOfferEyebrowText(response.savePer, offerTextContent,
        isPremiumCard, true, response.offerId);
      if (shouldSuppress) {
        if (specialPromo.parentElement) {
          specialPromo.parentElement.classList.remove('special-promo');
          specialPromo.remove();
        }
      } else {
        specialPromo.innerHTML = specialPromo.innerHTML.replace('{{savePercentage}}', response.savePer);
        specialPromoPercentageEyeBrowTextReplaced = true;
      }
    }
  });

  priceParent?.remove();
  return priceRow;
}

function createPricingSection(placeholders, pricingArea, ctaGroup, specialPromo) {
  const pricingSection = createTag('div', { class: 'pricing-section' });
  pricingArea.classList.add('pricing-area');
  const offer = pricingArea.querySelector(':scope > p > em');
  if (offer) {
    offer.classList.add('card-offer');
  }
  const pricingBtnContainer = pricingArea.querySelector('.button-container');
  if (pricingBtnContainer != null) {
    const pricingSuffixTextElem = pricingBtnContainer.nextElementSibling;
    const placeholderArr = pricingSuffixTextElem.textContent?.split(' ');
    const priceRow = handlePrice(placeholders, pricingArea, placeholderArr, specialPromo);
    if (priceRow) {
      pricingArea.prepend(priceRow);
      pricingBtnContainer?.remove();
      pricingSuffixTextElem?.remove();
    }
  }
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
    fetchPlanOnePlans(a.href).then(({
      url, country, language, offerId,
    }) => {
      a.href = buildUrl(url, country, language, offerId);
    });
    ctaGroup.append(a);
  });
  pricingSection.append(pricingArea);
  pricingSection.append(ctaGroup);
  return pricingSection;
}

function extractCurlyBracketsContent(inputString, card) {
  if (!inputString) {
    return;
  } 
  // Pattern to find text directly before the first {{...}} and all instances of {{...}}
  const pattern = /(.*?)\{\{(.+?)\}\}/g;
  const match = pattern.exec(inputString);  
  if (match) {
    const promoType = match[2].trim(); 
    const specialPromo = createTag('div');
    specialPromo.textContent = match[1].trim();
    card.classList.add(promoType);
    card.append(specialPromo);
  }
}

function decorateHeader(header, borderParams, card) {
  const h2 = header.querySelector('h2');
  // The raw text extracted from the word doc
  header.classList.add('card-header');
  extractCurlyBracketsContent(borderParams?.innerText, card);
  const premiumIcon = header.querySelector('img');
  if (premiumIcon) h2.append(premiumIcon);

  header.querySelectorAll('p').forEach((p) => {
    if (p.innerHTML.trim() === '') p.remove();
  });

  // Finds the headcount, removes it from the original string and creates an icon with the hc
  const extractHeadCountExp = /(>?)\(\d+(.*?)\)/;
  if (extractHeadCountExp.test(h2.innerText)) {
    const headCntDiv = createTag('div', { class: 'head-cnt', alt: '' });
    const headCount = h2.innerText.match(extractHeadCountExp)[0].replace(')', '').replace('(', '');
    [h2.innerText] = h2.innerText.split(extractHeadCountExp);
    headCntDiv.textContent = headCount;
    headCntDiv.prepend(createTag('img', { src: '/express/icons/head-count.svg', alt: 'icon-head-count' }));
    header.append(headCntDiv);
  }
}

function decorateCard({
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

  const specialPromo = decorateHeader(header, borderParams, cardBorder);
  card.append(header);

  cardBorder.append(card);
  if (explain.textContent.trim()) {
    explain.classList.add('card-explain');
    card.append(explain);
  }
  const mPricingSection = createPricingSection(placeholders, mPricingRow, mCtaGroup, specialPromo);
  mPricingSection.classList.add('monthly');
  const yPricingSection = createPricingSection(placeholders, yPricingRow, yCtaGroup, null);
  yPricingSection.classList.add('yearly', 'hide');
  function reactToPlanChange({ newValue }) {
    [mPricingSection, yPricingSection].forEach((section) => {
      if (section.classList.contains(plans[newValue])) {
        section.classList.remove('hide');
      } else {
        section.classList.add('hide');
      }
    });
  }
  reactToPlanChange({ newValue: BlockMediator.get(BILLING_PLAN) ?? 0 });
  BlockMediator.subscribe(BILLING_PLAN, reactToPlanChange);

  card.append(mPricingSection, yPricingSection);

  if (featureList.innerHTML.trim()) {
    featureList.classList.add('card-feature-list');
    card.append(featureList);
  }

  if (compare?.innerHTML.trim()) {
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
        // ignore
      }
    }
    card.append(compare);
  }
  return cardBorder;
}

const SALES_NUMBERS = '{{business-sales-numbers}}';

export default async function init(el) {
  const divs = blockKeys.map((_, index) => el.querySelectorAll(`:scope > div:nth-child(${index + 1}) > div`));

  const cards = Array.from(divs[0]).map((_, index) => blockKeys.reduce((obj, key, keyIndex) => {
    obj[key] = divs[keyIndex][index];
    return obj;
  }, {}));
  el.querySelectorAll(':scope > div:not(:last-of-type)').forEach((d) => d.remove());
  const cardsContainer = createTag('div', { class: 'cards-container' });
  const placeholders = await fetchPlaceholders();
  setVisitorCountry();
  cards
    .map((card) => decorateCard(card, el, placeholders))
    .forEach((card) => cardsContainer.append(card));
  const maxMCTACnt = cards.reduce((max, card) => Math.max(max, card.mCtaGroup.querySelectorAll('a').length), 0);
  if (maxMCTACnt > 1) {
    cards.forEach(({ mCtaGroup }) => {
      mCtaGroup.classList.add(`min-height-${maxMCTACnt}`);
    });
  }
  const maxYCTACnt = cards.reduce((max, card) => Math.max(max, card.yCtaGroup.querySelectorAll('a').length), 0);
  if (maxYCTACnt > 1) {
    cards.forEach(({ yCtaGroup }) => {
      yCtaGroup.classList.add(`min-height-${maxYCTACnt}`);
    });
  }
  const phoneNumberTags = [...cardsContainer.querySelectorAll('a')].filter((a) => a.title.includes(SALES_NUMBERS));
  if (phoneNumberTags.length > 0) {
    await formatSalesPhoneNumber(phoneNumberTags, SALES_NUMBERS);
  }
  el.prepend(cardsContainer);
}
