import { createTag, fetchPlaceholders } from '../../scripts/utils.js';
import { fetchPlan, buildUrl } from '../../scripts/utils/pricing.js';

const blockKeys = ['header', 'explain', 'offer', 'mPricingContainer', 'mCtaGroup', 'yPricingContainer', 'yCtaGroup', 'featureList', 'compare'];

function decorateCard({
  header, explain, offer, mPricingContainer, mCtaGroup, yPricingContainer, yCtaGroup, featureList, compare,
}, placeholders) {
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

  if (offer.textContent.trim()) {
    offer.classList.add('card-offer');
    mPricingContainer.append(offer);
  }
  
  createPricingSection(card, placeholders, mPricingContainer, mCtaGroup, 'monthly', 'show');
  createPricingSection(card, placeholders, yPricingContainer, yCtaGroup, 'yearly', 'hide'); 

  if (featureList.innerHTML.trim()) {
    featureList.classList.add('card-feature-list');
    card.append(featureList);
  }

  if (compare.innerHTML.trim()) {
    compare.classList.add('card-compare');
    compare.querySelector('a')?.classList.remove('button', 'accent');
    card.append(compare);
  }
  return card;
}

function createPricingSection(card, placeholders, container, ctaGroup, termClass, defaultClass) {
  container.classList.add('card-pricing');
  container.classList.add(termClass);
  container.classList.add(defaultClass);
  card.append(container);
  const pricingBtnContainer = container.querySelector('.button-container');
  if (pricingBtnContainer != null) {
    const pricingSuffixTextElem = pricingBtnContainer.nextElementSibling;
    const placeholderArr = pricingSuffixTextElem.textContent?.split(' '); 
    const phTextArr = placeholderArr.map((phText) => {
      const value = phText.replace('{{', '').replace('}}', '');
      return placeholders[value] ? placeholders[value] : '';
    });
    const priceSuffixContent = phTextArr.toString().replace(',', ' ');
    const pricePlan = handlePrice(card, priceSuffixContent);
    if (pricePlan) {
      container.prepend(pricePlan);
      pricingBtnContainer?.remove();
      pricingSuffixTextElem?.remove();
    } else {
      card.classList.add('no-price-type');
    }
  }
  ctaGroup.classList.add('card-cta-group');
  ctaGroup.classList.add(termClass);
  ctaGroup.classList.add(defaultClass);
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
  });
  card.append(ctaGroup);
}

function handlePrice(column, priceSuffixContext) {
  const pricePlan = createTag('div', { class: 'pricing-plan' });
  const priceEl = column.querySelector('[title="{{pricing}}"]');
  if (!priceEl) return null;
  const priceParent = priceEl?.parentNode;
  const plan = priceParent?.nextElementSibling?.querySelector('a') ? '' : priceParent?.nextElementSibling;

  const priceWrapper = createTag('div', { class: 'pricing-price-wrapper' });
  const price = createTag('span', { class: 'pricing-price' });
  const basePrice = createTag('span', { class: 'pricing-base-price' });
  const priceSuffix = createTag('div', { class: 'pricing-plan-suf' });

  priceWrapper.append(basePrice, price, priceSuffix);
  pricePlan.append(priceWrapper);

  fetchPlan(priceEl?.href).then((response) => {
    const parentP = priceEl.parentElement;
    price.innerHTML = response.formatted;
    basePrice.innerHTML = response.formattedBP || '';
    if(basePrice.innerHTML !== '') {
      price.classList.add('price-active');
    }
    else {
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

    const planCTA = column.querySelector(':scope > .button-container:last-of-type a.button');
    if (planCTA) planCTA.href = buildUrl(response.url, response.country, response.language);
  });

  priceParent?.remove();
  return pricePlan;
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
  cards.map((card) => decorateCard(card, placeholders)).forEach((card) => cardsContainer.append(card));
  const maxMSectionCTACnt = cards.reduce((max, card) => Math.max(max, card.mCtaGroup.querySelectorAll('a').length), 0);
  if (maxMSectionCTACnt > 1) {
    cards.forEach(({ mCtaGroup }) => {
      mCtaGroup.classList.add(`min-height-${maxMSectionCTACnt}`);
    });
  }
  const maxYSectionCTACnt = cards.reduce((max, card) => Math.max(max, card.yCtaGroup.querySelectorAll('a').length), 0);
  if (maxYSectionCTACnt > 1) {
    cards.forEach(({ yCtaGroup }) => {
      yCtaGroup.classList.add(`min-height-${maxYSectionCTACnt}`);
    });
  }
  el.prepend(cardsContainer);
}
