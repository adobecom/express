import { addTempWrapper } from '../../scripts/utils/decorate.js';
import buildCarousel from '../shared/carousel.js';
import { createTag } from '../../scripts/utils.js';

import {
  fetchPlan, buildUrl, shallSuppressOfferEyebrowText,
} from '../../scripts/utils/pricing.js';

function handleHeader(column) {
  column.classList.add('pricing-column');

  const title = column.querySelector('h2');
  const icon = column.querySelector('img');
  const header = createTag('div', { class: 'pricing-header' });

  header.append(title, icon);

  return header;
}

function handlePrice(block, column, eyeBrow) {
  const pricePlan = createTag('div', { class: 'pricing-plan' });
  const priceEl = column.querySelector('[title="{{pricing}}"]');
  if (!priceEl) return null;
  const priceParent = priceEl?.parentNode;
  const plan = priceParent?.nextElementSibling.querySelector('a') ? '' : priceParent?.nextElementSibling;

  const priceWrapper = createTag('div', { class: 'pricing-price-wrapper' });
  const price = createTag('span', { class: 'pricing-price' });
  const basePrice = createTag('span', { class: 'pricing-base-price' });
  const priceSuffix = createTag('div', { class: 'pricing-plan-suf' });

  priceWrapper.append(basePrice, price, priceSuffix);
  pricePlan.append(priceWrapper, plan);

  fetchPlan(priceEl?.href).then(({
    url, country, language, offerId, formatted, formattedBP, suffix, savePer, ooAvailable,
  }) => {
    const parentP = priceEl.parentElement;
    price.innerHTML = formatted;
    basePrice.innerHTML = formattedBP || '';

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
      priceSuffix.textContent = suffix;
    }

    const planCTA = column.querySelector(':scope > .button-container:last-of-type a.button');
    if (planCTA) planCTA.href = buildUrl(url, country, language, offerId);

    if (eyeBrow !== null) {
      const isPremiumCard = ooAvailable || false;
      const offerTextContent = eyeBrow.innerHTML;
      if (shallSuppressOfferEyebrowText(savePer, offerTextContent, isPremiumCard, true, offerId)) {
        eyeBrow.parentElement.classList.remove('has-pricing-eyebrow');
        eyeBrow.remove;
      } else {
        eyeBrow.innerHTML = offerTextContent.replace('{{savePercentage}}', savePer);
      }
    }
  });

  priceParent?.remove();
  return pricePlan;
}

function handleCtas(block, column) {
  const ctas = column.querySelectorAll('a');
  const mainCTA = ctas[ctas.length - 1];
  if (!mainCTA) return null;

  mainCTA.classList.add('button', 'cta', 'xlarge');

  const container = mainCTA.closest('p');
  if (container) {
    container.classList.add('button-container');
    if (container.querySelector('em') && container.querySelector('strong')) {
      mainCTA.classList.add('primary');
    }

    if (container.querySelector('em') && !container.querySelector('strong')) {
      mainCTA.classList.add('dark');
    }

    if (!container.querySelector('em') && container.querySelector('strong')) {
      // fixme: backward compatibility. to be removed later.
      if (block.classList.contains('feature')) {
        mainCTA.classList.add('secondary');
      }
    }
  }

  return container;
}

function handleDescription(column) {
  const description = createTag('div', { class: 'pricing-description' });
  [...column.children].forEach((element) => {
    if (!element.querySelector('svg, img, a.cta')) {
      description.append(element);
      element.querySelector('a')?.classList.add('details-cta');
    }
  });

  return description;
}

function handleFeatureList(featureColumns, index) {
  if (!featureColumns) return null;
  const featureList = featureColumns[index];
  featureList.classList.add('pricing-feature-list');
  return featureList;
}

function handleEyeBrows(columnWrapper, eyeBrowCols, index) {
  if (!eyeBrowCols) return null;
  if (!eyeBrowCols[index].innerHTML) {
    eyeBrowCols[index].remove();
    return null;
  }

  if (eyeBrowCols[index].textContent === '(gradient-border-only)') {
    columnWrapper.classList.add('card-gradient-background');
  }

  const eyebrow = createTag('div', { class: 'pricing-eyebrow' }, eyeBrowCols[index]);
  eyeBrowCols[index].classList.add('eyebrow-text');
  columnWrapper.classList.add('has-pricing-eyebrow');
  return eyebrow;
}

function alignContent(block) {
  const setElementsHeight = (contentWrappers) => {
    const elementsMinHeight = {
      'pricing-header': 0,
      'pricing-description': 0,
      'pricing-plan': 0,
    };

    const onIntersect = (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && contentWrappers.length) {
          contentWrappers.forEach((wrapper) => {
            const childDivs = wrapper.querySelectorAll(':scope > div');
            if (!childDivs.length) return;

            childDivs.forEach((div) => {
              elementsMinHeight[div.className] = Math.max(
                elementsMinHeight[div.className],
                div.offsetHeight,
              );
            });
          });

          contentWrappers.forEach((wrapper) => {
            const childDivs = wrapper.querySelectorAll(':scope > div');
            if (!childDivs.length) return;

            childDivs.forEach((div) => {
              if (!elementsMinHeight[div.className]) return;

              if (div.offsetHeight < elementsMinHeight[div.className]) {
                div.style.minHeight = `${elementsMinHeight[div.className]}px`;
              }
            });
          });

          observer.unobserve(block);
        }
      });
    };

    const observer = new IntersectionObserver(onIntersect, { threshold: 0 });
    observer.observe(block);
  };

  const contentWrappers = block.querySelectorAll('.pricing-content-wrapper');

  setElementsHeight(contentWrappers);
}

export default async function decorate(block) {
  addTempWrapper(block, 'pricing-summary');

  const pricingContainer = block.classList.contains('feature') ? block.children[2] : block.children[1];
  const featureColumns = block.classList.contains('feature') ? Array.from(block.children[3].children) : null;
  const eyeBrows = block.classList.contains('feature') ? Array.from(block.children[1].children) : null;
  pricingContainer.classList.add('pricing-container');
  const columnsContainer = createTag('div', { class: 'pricing-summary-columns-container' });
  const columns = Array.from(pricingContainer.children);
  pricingContainer.append(columnsContainer);
  const cardsLoaded = [];
  columns.forEach((column, index) => {
    const cardLoaded = new Promise((resolve) => {
      const columnWrapper = createTag('div', { class: 'pricing-column-wrapper' });
      columnWrapper.append(column);

      const contentWrapper = createTag('div', { class: 'pricing-content-wrapper' });
      const header = handleHeader(column);
      const eyeBrow = handleEyeBrows(columnWrapper, eyeBrows, index);
      const pricePlan = handlePrice(block, column, eyeBrow);
      const cta = handleCtas(block, column);
      const description = handleDescription(column);
      const featureList = handleFeatureList(featureColumns, index);

      contentWrapper.append(header, description);
      if (pricePlan) {
        contentWrapper.append(pricePlan);
      } else {
        columnWrapper.classList.add('no-price-type');
      }
      column.append(contentWrapper, cta);
      if (featureList) column.append(featureList);
      if (eyeBrow) columnWrapper.prepend(eyeBrow);

      columnsContainer.append(columnWrapper);
      resolve();
    });

    cardsLoaded.push(cardLoaded);
  });

  await Promise.all(cardsLoaded).then(() => {
    const options = {
      startPosition: 'right',
      centerAlign: true,
    };
    buildCarousel('.pricing-column-wrapper', columnsContainer, options);
    alignContent(block);
  });
}
