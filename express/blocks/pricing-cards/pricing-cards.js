import { createTag, fetchPlaceholders } from '../../scripts/utils.js';
import { fetchPlan, buildUrl, setInternationalCookie } from '../../scripts/utils/pricing.js';
import BlockMediator from '../../scripts/block-mediator.min.js';

const blockKeys = ['header', 'explain', 'mPricingRow', 'mCtaGroup', 'yPricingRow', 'yCtaGroup', 'featureList', 'compare'];
const plans = ['monthly', 'yearly']; // authored order should match with billing-radio
const BILLING_PLAN = 'billing-plan';

function handlePrice(pricingCard, priceSuffixContext) {
  const priceRow = createTag('div', { class: 'pricing-row' });
  const priceEl = pricingCard.querySelector('[title="{{pricing}}"]');
  if (!priceEl) return null;
  const priceParent = priceEl?.parentNode;

  const price = createTag('span', { class: 'pricing-price' });
  const basePrice = createTag('span', { class: 'pricing-base-price' });
  const priceSuffix = createTag('div', { class: 'pricing-row-suf' });

  priceRow.append(basePrice, price, priceSuffix);

  fetchPlan(priceEl?.href).then((response) => {
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
      priceSuffix.textContent = priceSuffixContext;
    }
  });

  priceParent?.remove();
  return priceRow;
}

function createPricingSection(placeholders, pricingArea, ctaGroup) {
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
    const phTextArr = placeholderArr.map((phText) => {
      const value = phText.replace('{{', '').replace('}}', '');
      return placeholders[value] ? placeholders[value] : '';
    });
    const priceSuffixContent = phTextArr.join(' ');
    const priceRow = handlePrice(pricingArea, priceSuffixContent);
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
    ctaGroup.append(a);
    fetchPlan(a?.href).then((response) => {
      a.href = buildUrl(response.url, response.country, response.language, response.offerId);
    });
  });
  pricingSection.append(pricingArea);
  pricingSection.append(ctaGroup);
  return pricingSection;
}

function decorateCard({
  header,
  explain,
  mPricingRow,
  mCtaGroup,
  yPricingRow,
  yCtaGroup,
  featureList,
  compare,
}, el, placeholders) {
  const card = createTag('div', { class: 'card' });
  header.classList.add('card-header');
  const h2 = header.querySelector('h2');
  const h2Content = h2.textContent.trim();
  const headerConfig = /\((.+)\)/.exec(h2Content);
  const premiumIcon = header.querySelector('img');
  if (premiumIcon) h2.prepend(premiumIcon);
  if (headerConfig) {
    const cfg = headerConfig[1];
    h2.textContent = (h2Content.replace(`(${cfg})`, '').trim());
    if (/^\d/.test(cfg)) {
      const headCntDiv = createTag('div', { class: 'head-cnt', alt: '' });
      headCntDiv.textContent = cfg;
      headCntDiv.prepend(createTag('img', { src: '/express/icons/head-count.svg', alt: 'icon-head-count' }));
      header.append(headCntDiv);
    } else {
      const specialPromo = createTag('div');
      specialPromo.textContent = cfg;
      card.classList.add('special-promo');
      card.append(specialPromo);
    }
  }
  header.querySelectorAll('p').forEach((p) => {
    if (p.innerHTML.trim() === '') p.remove();
  });
  card.append(header);

  if (explain.textContent.trim()) {
    explain.classList.add('card-explain');
    card.append(explain);
  }

  const mPricingSection = createPricingSection(placeholders, mPricingRow, mCtaGroup);
  mPricingSection.classList.add('monthly');
  const yPricingSection = createPricingSection(placeholders, yPricingRow, yCtaGroup);
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

  if (compare.innerHTML.trim()) {
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
  return card;
}

export default async function init(el) {
  const divs = blockKeys.map((_, index) => el.querySelectorAll(`:scope > div:nth-child(${index + 1}) > div`));
  const cards = Array.from(divs[0]).map((_, index) => blockKeys.reduce((obj, key, keyIndex) => {
    obj[key] = divs[keyIndex][index];
    return obj;
  }, {}));
  el.querySelectorAll(':scope > div:not(:last-of-type)').forEach((d) => d.remove());
  const cardsContainer = createTag('div', { class: 'cards-container' });
  const placeholders = await fetchPlaceholders();
  setInternationalCookie();
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
  el.prepend(cardsContainer);
}
